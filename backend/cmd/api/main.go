// LOKASI: cmd/api/main.go
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	driverPostgres "gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/internal/service/exporter"
	"ykpbabakanciwaringin.id/cbt-backend/internal/service/importer"

	_ "ykpbabakanciwaringin.id/cbt-backend/docs"
	handler "ykpbabakanciwaringin.id/cbt-backend/internal/delivery/http"
	"ykpbabakanciwaringin.id/cbt-backend/internal/delivery/http/middleware"
	"ykpbabakanciwaringin.id/cbt-backend/internal/repository/postgres"
	repo "ykpbabakanciwaringin.id/cbt-backend/internal/repository/postgres"
	"ykpbabakanciwaringin.id/cbt-backend/internal/repository/thirdparty"
	"ykpbabakanciwaringin.id/cbt-backend/internal/usecase"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/logger"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/whatsapp"
)

func main() {
	// =========================================================================
	// 1. PENGATURAN DASAR & KONFIGURASI
	// =========================================================================
	time.Local = utils.WIB

	logger.Init()
	cfg, err := utils.LoadConfig("./config")
	if err != nil {
		log.Fatalf("Gagal memuat konfigurasi: %v", err)
	}

	// =========================================================================
	// 2. KONEKSI & MIGRASI DATABASE (High Availability Mode)
	// =========================================================================
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Jakarta",
		cfg.Database.Host, cfg.Database.User, cfg.Database.Password, cfg.Database.Name, cfg.Database.Port, cfg.Database.SSLMode)

	customLogger := gormlogger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		gormlogger.Config{
			SlowThreshold:             2 * time.Second,
			LogLevel:                  gormlogger.Warn,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	db, err := gorm.Open(driverPostgres.Open(dsn), &gorm.Config{
		Logger: customLogger,
		NowFunc: func() time.Time {
			return utils.NowWIB()
		},
	})
	if err != nil {
		logger.Error("Gagal terkoneksi ke database:", err)
		log.Fatalf("Gagal terkoneksi ke database: %v", err)
	}

	sqlDB, errDB := db.DB()
	if errDB == nil {
		sqlDB.SetMaxOpenConns(100)
		sqlDB.SetMaxIdleConns(20)
		sqlDB.SetConnMaxLifetime(30 * time.Minute)
		sqlDB.SetConnMaxIdleTime(10 * time.Minute)
	}

	logger.Info("Memulai migrasi struktur database ke PostgreSQL...")

	if err := db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"").Error; err != nil {
		logger.Error("Gagal memastikan ekstensi uuid-ossp:", err)
	}

	err = db.AutoMigrate(
		&domain.Institution{},
		&domain.Dorm{},
		&domain.Room{},
		&domain.Program{},
		&domain.ClassProgram{},
		&domain.User{},
		&domain.AcademicYear{},
		&domain.Curriculum{},
		&domain.Class{},
		&domain.Profile{},
		&domain.Enrollment{},
		&domain.SubjectGroup{},
		&domain.Subject{},
		&domain.TeachingAllocation{},
		&domain.ClassSchedule{},
		&domain.ClassSession{},
		&domain.Journal{},
		&domain.Attendance{},
		&domain.StudentReport{},
		&domain.QuestionBank{},
		&domain.ExamEvent{},
		&domain.ExamSession{},
		&domain.ExamProctor{},
		&domain.ExamSupervisor{},
		&domain.ExamParticipant{},
		&domain.ParticipantSubtest{},
		&domain.StudentAnswer{},
		&domain.Holiday{},
		&domain.TeacherAttendance{},
		&domain.Assignment{},
		&domain.FinanceCategory{},
		&domain.FinanceBilling{},
		&domain.FinancePayment{},
		&domain.FinanceRukhsoh{},
	)
	if err != nil {
		log.Fatalf("Kesalahan Migrasi Database: %v\n", err)
	}
	logger.Info("Migrasi database BERHASIL. Seluruh tabel siap digunakan.")

	// =========================================================================
	// 3. INISIALISASI LAYER REPOSITORIES (Akses Data)
	// =========================================================================
	userRepo := repo.NewUserRepository(db)
	accountRepo := postgres.NewAccountRepository(db)
	instRepo := repo.NewInstitutionRepository(db)
	classRepo := repo.NewClassRepository(db)
	subjectRepo := repo.NewSubjectRepository(db)
	academicYearRepo := repo.NewAcademicYearRepository(db)
	curriculumRepo := repo.NewCurriculumRepository(db)
	studentRepo := repo.NewStudentRepository(db)
	teacherRepo := repo.NewTeacherRepository(db)
	examExecutionRepo := repo.NewExamExecutionRepository(db)
	examSessionRepo := repo.NewExamSessionRepository(db)
	examEventRepo := repo.NewExamEventRepository(db)
	questionRepo := repo.NewQuestionRepository(db)
	studentExamRepo := repo.NewStudentExamRepository(db)
	examResultRepo := repo.NewExamResultRepository(db)
	dashboardRepo := repo.NewDashboardRepository(db)
	reportRepo := repo.NewReportRepository(db)
	scheduleRepo := repo.NewScheduleRepository(db)
	journalRepo := repo.NewJournalRepository(db)
	assignmentRepo := repo.NewAssignmentRepository(db)
	financeRepo := repo.NewFinanceRepository(db)
	masterDataRepo := repo.NewMasterDataRepository(db)

	// =========================================================================
	// 4. INISIALISASI EXTERNAL SERVICES & EXPORTER LAYER (I/O & API)
	// =========================================================================
	pqRepo := thirdparty.NewPesantrenQuRepository(os.Getenv("PESANTRENQU_PARTNER_KEY"), "", "")
	waClient := whatsapp.NewStarSenderClient(cfg.WhatsApp.APIKey)

	excelImporter := importer.NewExcelImporter()

	examResultExporter := exporter.NewExamResultExporter()
	examResultPdfExporter := exporter.NewExamResultPdfExporter()
	examSessionExporter := exporter.NewExamSessionExporter()

	userExporter := exporter.NewUserExporter()
	assignmentExporter := exporter.NewAssignmentExporter()
	assignmentPdfExporter := exporter.NewAssignmentPdfExporter()
	journalExporter := exporter.NewJournalExporter()
	scheduleExporter := exporter.NewScheduleExporter()
	questionExporter := exporter.NewQuestionExporter()
	questionPdfExporter := exporter.NewQuestionPdfExporter()

	// =========================================================================
	// 5. INISIALISASI LAYER USECASES (Logika Bisnis)
	// =========================================================================
	accountUsecase := usecase.NewAccountUsecase(accountRepo)
	authUsecase := usecase.NewAuthUsecase(userRepo, cfg.JWT.SecretKey, cfg.JWT.ExpirationHours, waClient, cfg.SMTP)
	instUsecase := usecase.NewInstitutionUsecase(instRepo)
	mediaUsecase := usecase.NewMediaUsecase()
	templateUsecase := usecase.NewTemplateUsecase(classRepo, instRepo, subjectRepo, studentRepo, teacherRepo, curriculumRepo, examEventRepo)
	subjectUsecase := usecase.NewSubjectUsecase(subjectRepo, curriculumRepo)
	teacherUsecase := usecase.NewTeacherUsecase(teacherRepo)
	studentUsecase := usecase.NewStudentUsecase(studentRepo, classRepo)
	studentExamUsecase := usecase.NewStudentExamUsecase(studentExamRepo, examExecutionRepo)
	classUsecase := usecase.NewClassUsecase(classRepo, teacherRepo)

	questionUsecase := usecase.NewQuestionUsecase(questionRepo, questionExporter, questionPdfExporter, academicYearRepo, scheduleRepo, subjectRepo, teacherRepo, excelImporter, classRepo)

	examExecutionUsecase := usecase.NewExamExecutionUsecase(examExecutionRepo)

	examSessionUsecase := usecase.NewExamSessionUsecase(examSessionRepo, questionRepo, studentRepo, teacherRepo, examEventRepo, examResultPdfExporter, examSessionExporter)
	examEventUsecase := usecase.NewExamEventUsecase(examEventRepo)
	examResultUsecase := usecase.NewExamResultUsecase(examResultRepo, examResultExporter)

	dashboardUsecase := usecase.NewDashboardUsecase(dashboardRepo)
	reportUsecase := usecase.NewReportUsecase(reportRepo, classRepo)
	ayUsecase := usecase.NewAcademicYearUsecase(academicYearRepo)
	currUsecase := usecase.NewCurriculumUsecase(curriculumRepo)
	scheduleUsecase := usecase.NewScheduleUsecase(scheduleRepo, scheduleExporter)
	assignmentUsecase := usecase.NewAssignmentUsecase(assignmentRepo, assignmentExporter, assignmentPdfExporter, excelImporter)
	pqUsecase := usecase.NewPesantrenQuUsecase(pqRepo)
	journalUsecase := usecase.NewJournalUsecase(journalRepo, pqUsecase, journalExporter)
	financeUsecase := usecase.NewFinanceUsecase(financeRepo, instRepo, 10*time.Second)
	masterDataUsecase := usecase.NewMasterDataUsecase(masterDataRepo)

	pdfUsecase := usecase.NewPdfUsecase(examSessionRepo, instRepo, userExporter)

	// =========================================================================
	// 6. SETUP ROUTER & MIDDLEWARE (HTTP Server)
	// =========================================================================
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:3000", "http://127.0.0.1:3000",
			"https://ykpbabakanciwaringin.id", "https://www.ykpbabakanciwaringin.id",
		},
		AllowOriginFunc: func(origin string) bool {
			return strings.HasPrefix(origin, "http://192.168.") || strings.HasPrefix(origin, "http://10.") || strings.HasPrefix(origin, "http://172.")
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-SafeExamBrowser-ConfigKeyHash", "X-SafeExamBrowser-RequestHash"},
		ExposeHeaders:    []string{"Content-Length", "Content-Disposition"},
		AllowCredentials: true,
	}))

	r.Static("/uploads", "./static/uploads")
	r.Static("/static", "./static")
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	limitMiddleware := middleware.NewIPLimiter(10, 20).GetLimiterMiddleware()

	// =========================================================================
	// 7. INISIALISASI LAYER HANDLERS & REGISTRASI ROUTES
	// =========================================================================
	appHandlers := &handler.AppHandlers{
		Auth:           handler.NewAuthHandler(authUsecase),
		Account:        handler.NewAccountHandler(accountUsecase),
		Institution:    handler.NewInstitutionHandler(instUsecase),
		Class:          handler.NewClassHandler(classUsecase),
		Media:          handler.NewMediaHandler(mediaUsecase),
		Pdf:            handler.NewPdfHandler(pdfUsecase),
		Template:       handler.NewTemplateHandler(templateUsecase),
		Subject:        handler.NewSubjectHandler(subjectUsecase),
		Teacher:        handler.NewTeacherHandler(teacherUsecase, pdfUsecase, templateUsecase),
		Student:        handler.NewStudentHandler(studentUsecase, pdfUsecase, templateUsecase),
		StudentExam:    handler.NewStudentExamHandler(studentExamUsecase),
		QuestionPacket: handler.NewQuestionPacketHandler(questionUsecase),
		QuestionItem:   handler.NewQuestionItemHandler(questionUsecase),
		ExamEvent:      handler.NewExamEventHandler(examEventUsecase),
		ExamSession:    handler.NewExamSessionHandler(examSessionUsecase),
		ExamExecution:  handler.NewExamExecutionHandler(examExecutionUsecase),
		ExamResult:     handler.NewExamResultHandler(examResultUsecase),
		Dashboard:      handler.NewDashboardHandler(dashboardUsecase),
		Report:         handler.NewReportHandler(reportUsecase),
		AcademicYear:   handler.NewAcademicYearHandler(ayUsecase),
		Curriculum:     handler.NewCurriculumHandler(currUsecase),
		Schedule:       handler.NewScheduleHandler(scheduleUsecase),
		Journal:        handler.NewJournalHandler(journalUsecase),
		Assignment:     handler.NewAssignmentHandler(assignmentUsecase),
		Finance:        handler.NewFinanceHandler(financeUsecase),
		MasterData:     handler.NewMasterDataHandler(masterDataUsecase),
	}

	handler.SetupRoutes(r, appHandlers, cfg.JWT.SecretKey, limitMiddleware, examExecutionRepo, studentExamRepo, userRepo)

	// =========================================================================
	// 8. SERVER START & GRACEFUL SHUTDOWN
	// =========================================================================
	port := cfg.Server.Port
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		logger.Infof("Server Yayasan Kebajikan Pesantren berjalan di port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("Menerima sinyal pemutusan koneksi, mematikan server secara aman...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("Server dipaksa mati:", err)
	}
	logger.Info("Server berhasil dihentikan.")
}
