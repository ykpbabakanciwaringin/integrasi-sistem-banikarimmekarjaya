// LOKASI: internal/delivery/http/router.go
package http

import (
	"github.com/gin-gonic/gin"
	"banikarimmekarjaya.id/cbt-backend/internal/delivery/http/middleware"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

type AppHandlers struct {
	Auth           *AuthHandler
	Account        *AccountHandler
	Institution    *InstitutionHandler
	Class          *ClassHandler
	Media          *MediaHandler
	Pdf            *PdfHandler
	Template       *TemplateHandler
	Subject        *SubjectHandler
	Teacher        *TeacherHandler
	Student        *StudentHandler
	StudentExam    *StudentExamHandler
	QuestionPacket *QuestionPacketHandler
	QuestionItem   *QuestionItemHandler
	ExamSession    *ExamSessionHandler
	ExamExecution  *ExamExecutionHandler
	ExamResult     *ExamResultHandler
	ExamEvent      *ExamEventHandler
	Dashboard      *DashboardHandler
	Report         *ReportHandler
	AcademicYear   *AcademicYearHandler
	Curriculum     *CurriculumHandler
	Schedule       *ScheduleHandler
	Journal        *JournalHandler
	Assignment     *AssignmentHandler
	Finance        *FinanceHandler
	MasterData     *MasterDataHandler
}

func SetupRoutes(r *gin.Engine, h *AppHandlers, jwtSecret string, limitMiddleware gin.HandlerFunc, examExecutionRepo domain.ExamExecutionRepository, studentExamRepo domain.StudentExamRepository, userRepo domain.UserRepository) {
	api := r.Group("/api/v1")
	{
		// === PUBLIC ROUTES ===
		api.GET("/health", h.Dashboard.HealthCheck)
		api.GET("/auth/setup-check", h.Auth.CheckSetup)
		api.POST("/auth/setup", h.Auth.SetupFirstAdmin)
		api.POST("/auth/login", limitMiddleware, h.Auth.Login)
		api.POST("/auth/reset-password", limitMiddleware, h.Auth.ResetPassword)
		api.POST("/auth/register", limitMiddleware, h.Auth.RegisterPublic)
		api.POST("/auth/forgot-password", limitMiddleware, h.Auth.RequestResetPassword)
		api.GET("/public/institutions", h.Institution.GetAll)
		api.GET("/public/verify/teacher/:id", h.Teacher.GetTeacherDetail)
		api.GET("/public/verify/student/:id", h.Student.GetStudentDetail)
		api.GET("/public/verify/sessions/:id", h.ExamSession.GetSessionDetail)
		api.GET("/public/verify/sessions/:id/results", h.ExamResult.GetSessionResults)

		// === PROTECTED ROUTES (Wajib Login) ===
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware(jwtSecret, userRepo))
		{
			protected.GET("/auth/me", h.Auth.GetMe)
			protected.PUT("/auth/profile", h.Auth.UpdateMyProfile)
			protected.POST("/auth/change-password", h.Auth.ChangePassword)
			protected.POST("/auth/switch-institution", h.Auth.SwitchInstitution)

			// 1. AREA MANAJEMEN AKUN
			accGroup := protected.Group("/accounts")
			accGroup.Use(middleware.RoleMiddleware(domain.RoleSuperAdmin, domain.RoleAdmin))
			{
				accGroup.GET("", h.Account.GetAccounts)
				accGroup.POST("", h.Account.CreateAccount)
				accGroup.PUT("/:id", h.Account.UpdateAccount)
				accGroup.DELETE("/:id", h.Account.DeleteAccount)
				accGroup.POST("/:id/enrollments", h.Account.AddEnrollment)
				accGroup.PUT("/:id/enrollments/:enrollment_id", h.Account.UpdateEnrollment)
				accGroup.DELETE("/:id/enrollments/:enrollment_id", h.Account.DeleteEnrollment)
			}

			// 2. AREA KHUSUS SUPER ADMIN
			superAdmin := protected.Group("/")
			superAdmin.Use(middleware.RoleMiddleware(domain.RoleSuperAdmin))
			{
				inst := superAdmin.Group("/institutions")
				{
					inst.POST("", h.Institution.Create)
					inst.POST("/import", h.Institution.Import)
					inst.PUT("/:id", h.Institution.Update)
					inst.DELETE("/:id", h.Institution.Delete)

					// Menggunakan PATCH karena hanya memperbarui sebagian (status & key)
					inst.PATCH("/:id/pq-settings", h.Institution.UpdatePqSettings)
				}
			}

			// 3. AREA ADMIN (Modifikasi/Write Access)
			admin := protected.Group("/")
			admin.Use(middleware.RoleMiddleware(domain.RoleSuperAdmin, domain.RoleAdmin, domain.RoleAdminAcademic))
			{
				masterData := protected.Group("/master")
				{
					masterData.GET("/dorms", h.MasterData.GetDorms)
					masterData.GET("/dorms/:dorm_id/rooms", h.MasterData.GetRooms)
					masterData.GET("/programs", h.MasterData.GetPrograms)
					masterData.GET("/programs/:program_id/classes", h.MasterData.GetClassPrograms)

					adminMaster := masterData.Group("")
					adminMaster.Use(middleware.RoleMiddleware(domain.RoleSuperAdmin, domain.RoleAdmin))
					{
						adminMaster.POST("/dorms", h.MasterData.CreateDorm)
						adminMaster.POST("/dorms/:dorm_id/rooms", h.MasterData.CreateRoom)
						adminMaster.POST("/programs", h.MasterData.CreateProgram)
						adminMaster.POST("/programs/:program_id/classes", h.MasterData.CreateClassProgram)
					}
				}
				aca := admin.Group("/academic")
				{
					aca.POST("/classes", h.Class.CreateClass)
					aca.PUT("/classes/:id", h.Class.UpdateClass)
					aca.DELETE("/classes/:id", h.Class.DeleteClass)
					aca.POST("/classes/import", h.Class.ImportClasses)
					aca.PUT("/classes/:id/homeroom", h.Class.AssignHomeroom)

					aca.POST("/subjects", h.Subject.Create)
					aca.PUT("/subjects/:id", h.Subject.Update)
					aca.DELETE("/subjects/:id", h.Subject.Delete)

					aca.POST("/assignments", h.Assignment.Create)
					aca.PUT("/assignments/:id/kkm", h.Assignment.UpdateKKM)
					aca.DELETE("/assignments/:id", h.Assignment.Delete)

					aca.POST("/holidays", h.Curriculum.CreateHoliday)
					aca.PUT("/holidays/:id", h.Curriculum.UpdateHoliday)
					aca.DELETE("/holidays/:id", h.Curriculum.DeleteHoliday)
					aca.PUT("/weekly-day-off", h.Institution.UpdateWeeklyDayOff)
				}

				tch := admin.Group("/teachers")
				{
					tch.GET("", h.Teacher.GetTeachers)
					tch.POST("", h.Teacher.CreateTeacher)
					tch.POST("/import", h.Teacher.ImportTeachers)
					tch.PUT("/:id", h.Teacher.UpdateTeacher)
					tch.DELETE("/:id", h.Teacher.DeleteTeacher)
				}

				std := admin.Group("/students")
				{
					std.POST("", h.Student.CreateStudent)
					std.POST("/import", h.Student.ImportStudents)
					std.PUT("/:id", h.Student.UpdateStudent)
					std.DELETE("/:id", h.Student.DeleteStudent)
					std.PUT("/:id/password", h.Student.ResetStudentPassword)
				}

				ayAdmin := admin.Group("/academic-years")
				{
					ayAdmin.POST("", h.AcademicYear.Create)
					ayAdmin.PUT("/:id", h.AcademicYear.Update)
					ayAdmin.DELETE("/:id", h.AcademicYear.Delete)
					ayAdmin.PUT("/:id/active", h.AcademicYear.SetActive)
				}

				curr := admin.Group("/curriculums")
				{
					curr.GET("", h.Curriculum.GetCurriculums)
					curr.POST("", h.Curriculum.CreateCurriculum)
					curr.PUT("/:id", h.Curriculum.UpdateCurriculum)
					curr.DELETE("/:id", h.Curriculum.DeleteCurriculum)
					curr.GET("/:id/groups", h.Curriculum.GetSubjectGroups)
					curr.POST("/:id/groups", h.Curriculum.CreateSubjectGroup)
					curr.DELETE("/:id/groups/:groupId", h.Curriculum.DeleteSubjectGroup)
				}

				sched := admin.Group("/schedules")
				{
					sched.POST("/allocations", h.Schedule.CreateAllocation)
					sched.DELETE("/allocations/:id", h.Schedule.DeleteAllocation)
					sched.POST("/allocations/:allocationId/detail", h.Schedule.AddSchedule)
					sched.DELETE("/detail/:scheduleId", h.Schedule.DeleteSchedule)
					sched.GET("/export-excel", h.Schedule.ExportExcel)
					sched.GET("/export-pdf", h.Schedule.ExportSessionResultsPDF)
					sched.GET("/sessions", h.Schedule.GetSessions)
					sched.POST("/sessions", h.Schedule.CreateSession)
					sched.DELETE("/sessions/:id", h.Schedule.DeleteSession)
				}

				templates := admin.Group("/utils/templates")
				{
					templates.GET("/students", h.Template.DownloadStudentTemplate)
					templates.GET("/teachers", h.Template.DownloadTeacherTemplate)
					templates.GET("/institutions", h.Template.DownloadInstitutionTemplate)
					templates.GET("/classes", h.Template.DownloadClassTemplate)
					templates.GET("/participants", h.Template.DownloadExamParticipantTemplate)
					templates.GET("/subjects", h.Template.DownloadSubjectTemplate)
					templates.GET("/exam-sessions", h.Template.DownloadExamSessionTemplate)
					templates.GET("/assignments", h.Assignment.DownloadTemplate)
				}

				exAdmin := admin.Group("/exams")
				{
					exAdmin.POST("/events", h.ExamEvent.CreateEvent)
					exAdmin.PUT("/events/:id", h.ExamEvent.UpdateEvent)
					exAdmin.DELETE("/events/:id", h.ExamEvent.DeleteEvent)
					exAdmin.POST("/sessions", h.ExamSession.CreateSession)
					exAdmin.PUT("/sessions/:id", h.ExamSession.UpdateSession)
					exAdmin.DELETE("/sessions/:id", h.ExamSession.DeleteSession)
					exAdmin.POST("/sessions/:id/stop", h.ExamSession.StopSession)
					exAdmin.POST("/sessions/:id/resume", h.ExamSession.ResumeSession)
					exAdmin.POST("/sessions/:id/participants", h.ExamSession.AddParticipant)
					exAdmin.POST("/sessions/:id/participants/bulk", h.ExamSession.AddBulkParticipants)
					exAdmin.POST("/sessions/:id/participants/import", h.ExamSession.ImportParticipants)
					exAdmin.DELETE("/sessions/:id/participants/:studentId", h.ExamSession.RemoveParticipant)
					exAdmin.POST("/sessions/:id/participants/:studentId/reset-login", h.ExamSession.ResetStudentLogin)
					exAdmin.POST("/sessions/:id/participants/:studentId/toggle-block", h.ExamSession.ToggleBlockStudent)
					exAdmin.POST("/sessions/:id/participants/:studentId/generate-password", h.ExamSession.GenerateNewPassword)
					exAdmin.POST("/sessions/:id/participants/bulk-generate-password", h.ExamSession.GenerateBulkNewPassword)
					exAdmin.POST("/sessions/:id/proctors", h.ExamSession.AssignProctors)
					exAdmin.POST("/bulk-upload-photos", h.ExamSession.BulkUploadPhotos)
					exAdmin.POST("/events/:id/sessions/import", h.ExamSession.ImportSessions)
					exAdmin.GET("/sessions/:id/template-participants", h.ExamSession.DownloadParticipantTemplate)
				}

				financeRoutes := protected.Group("/finance")
				financeRoutes.Use(middleware.RoleMiddleware(domain.RoleSuperAdmin, domain.RoleAdminFinance))
				{
					financeRoutes.GET("/billings", h.Finance.GetBillings)
					financeRoutes.POST("/payments", h.Finance.ProcessPayment)
					financeRoutes.POST("/import/preview", h.Finance.PreviewImportExcel)
					financeRoutes.POST("/import/execute", h.Finance.ExecuteImportExcel)
					financeRoutes.GET("/export/excel", h.Finance.ExportBillingReportExcel)
					financeRoutes.GET("/billings/:student_id/kartu-pembayaran", h.Finance.GenerateKartuPembayaranPDF)
					financeRoutes.POST("/rukhsoh/pdf", h.Finance.GenerateSuratPernyataanPDF)
					financeRoutes.GET("/summary", h.Finance.HandleGetSummary)
					financeRoutes.GET("/categories", h.Finance.GetCategories)
					financeRoutes.POST("/categories", h.Finance.CreateCategory)
					financeRoutes.PUT("/categories/:id", h.Finance.UpdateCategory)
					financeRoutes.DELETE("/categories/:id", h.Finance.DeleteCategory)
					financeRoutes.GET("/filter-options", h.Finance.GetFilterOptions)
				}
			}

			// 4. AREA STAFF UMUM (Read Access / Guru)
			staff := protected.Group("/")
			staff.Use(middleware.RoleMiddleware(domain.RoleSuperAdmin, domain.RoleAdmin, domain.RoleAdminAcademic, domain.RoleTeacher))
			{
				staff.GET("/dashboard/stats", h.Dashboard.GetStats)
				staff.POST("/reports", h.Report.InputReport)
				staff.GET("/reports/class/:id/leger", h.Report.GetClassLeger)

				// =======================================================
				// AREA LEMBAGA & EXPORTNYA
				// =======================================================
				staff.GET("/institutions", h.Institution.GetAll)
				staff.GET("/institutions/export/excel", h.Institution.ExportExcel) // <-- FASE 4
				staff.GET("/institutions/export/pdf", h.Institution.ExportPDF)     // <-- FASE 4

				staff.GET("/academic/holidays", h.Curriculum.GetHolidays)

				staff.GET("/academic/assignments", h.Assignment.GetAll)
				staff.GET("/academic/assignments/:id", h.Assignment.GetDetail)
				staff.GET("/academic/assignments/:id/grades", h.Assignment.GetGrades)
				staff.GET("/academic/assignments/:id/export", h.Assignment.ExportExcel)
				staff.GET("/academic/assignments/:id/pdf", h.Assignment.ExportPDF)
				staff.GET("/academic/assignments/export-list/excel", h.Assignment.ExportListExcel)
				staff.GET("/academic/assignments/export-list/pdf", h.Assignment.ExportListPDF)

				stdStaff := staff.Group("/students")
				{
					stdStaff.GET("", h.Student.GetStudents)
					stdStaff.GET("/export-excel", h.Student.ExportStudentsExcel)
					stdStaff.GET("/export-pdf", h.Student.ExportStudentsPDF)
				}

				clsStaff := staff.Group("/academic/classes")
				{
					clsStaff.GET("", h.Class.GetClasses)
				}

				tchStaff := staff.Group("/teachers")
				{
					tchStaff.GET("/attendance", h.Teacher.GetAttendances)
					tchStaff.POST("/attendance", h.Teacher.SubmitAttendance)
					tchStaff.GET("/export/excel", h.Teacher.ExportTeachersExcel)
					tchStaff.GET("/export/pdf", h.Teacher.ExportTeachersPDF)
				}

				subjStaff := staff.Group("/academic/subjects")
				{
					subjStaff.GET("", h.Subject.GetAll)
				}

				ayStaff := staff.Group("/academic-years")
				{
					ayStaff.GET("", h.AcademicYear.GetAll)
					ayStaff.GET("/active", h.AcademicYear.GetActive)
				}

				schedStaff := staff.Group("/schedules")
				{
					schedStaff.GET("/allocations", h.Schedule.GetAllocations)
				}

				utilsGrp := staff.Group("/utils")
				{
					utilsGrp.POST("/upload", h.Media.UploadImage)
					utilsGrp.GET("/pdf/exam-cards/:session_id", h.Pdf.DownloadExamCards)
					utilsGrp.GET("/templates/questions", h.Template.DownloadQuestionTemplate)
				}

				journal := staff.Group("/journals")
				{
					journal.GET("", h.Journal.GetJournals)
					journal.POST("", h.Journal.CreateJournal)
					journal.GET("/export", h.Journal.ExportRecap)
					journal.PUT("/:id", h.Journal.UpdateJournal)
					journal.DELETE("/:id", h.Journal.DeleteJournal)
					journal.GET("/:id/attendances", h.Journal.GetAttendances)
					journal.POST("/:id/attendances", h.Journal.SubmitAttendances)
					journal.PUT("/:id/verify", h.Journal.VerifyJournal)
					journal.POST("/:id/retry-sync", h.Journal.RetrySync)
				}

				q := staff.Group("/questions")
				{

					q.GET("/packets", h.QuestionPacket.GetPackets)
					q.GET("/packets/export", h.QuestionPacket.ExportExcel)
					q.GET("/packets/export/pdf", h.QuestionPacket.ExportPDF)

					q.GET("/packets/template-batch", h.QuestionPacket.DownloadTemplateBatch)
					q.POST("/packets/import-batch", h.QuestionPacket.ImportPackets)
					q.GET("/packets/export-list", h.QuestionPacket.ExportPacketList)

					q.GET("/packets/:id", h.QuestionPacket.GetPacketDetail)
					q.POST("/packets", h.QuestionPacket.CreatePacket)
					q.PUT("/packets/:id", h.QuestionPacket.UpdatePacket)
					q.DELETE("/packets/:id", h.QuestionPacket.DeletePacket)

					q.POST("/items", h.QuestionItem.CreateItem)
					q.PUT("/items/:id", h.QuestionItem.UpdateItem)
					q.DELETE("/items/:id", h.QuestionItem.DeleteItem)
					q.POST("/import", h.QuestionItem.ImportQuestions)
				}

				exStaff := staff.Group("/exams")
				{
					exStaff.GET("/events", h.ExamEvent.GetEvents)
					exStaff.GET("/events/:id", h.ExamEvent.GetEventDetail)
					exStaff.GET("/events/:id/seb-config", h.ExamEvent.DownloadSEBConfig)
					exStaff.GET("/events/:id/participants-cards", h.ExamEvent.DownloadEventExamCards)
					exStaff.GET("/sessions", h.ExamSession.GetSessions)

					exStaff.GET("/sessions/:id", h.ExamSession.GetSessionDetail)
					exStaff.GET("/sessions/:id/participants", h.ExamSession.GetSessionParticipants)

					exStaff.GET("/sessions/:id/participants-cards", h.ExamSession.DownloadExamCards)

					exStaff.GET("/sessions/:id/photo-reference", h.ExamSession.DownloadPhotoReference)
					exStaff.GET("/sessions/:id/berita-acara/pdf", h.ExamSession.DownloadBeritaAcaraPDF)
					exStaff.GET("/sessions/:id/results", h.ExamResult.GetSessionResults)
					exStaff.GET("/sessions/:id/results/export", h.ExamResult.ExportSessionResults)
					exStaff.GET("/sessions/:id/results/pdf", h.ExamResult.ExportSessionResultsPDF)
					exStaff.GET("/events/:id/sessions/export/excel", h.ExamSession.ExportSessionsExcel)
					exStaff.GET("/events/:id/sessions/export/pdf", h.ExamSession.ExportSessionsPDF)
				}
			}

			// 5. AREA KHUSUS SISWA (Portal Ujian)
			studentExam := protected.Group("/exams/student")
			studentExam.Use(middleware.RoleMiddleware(domain.RoleStudent))
			{
				studentExam.POST("/join", h.ExamExecution.JoinExam)
				studentExam.POST("/submit", limitMiddleware, h.ExamExecution.SubmitAnswer)
				studentExam.POST("/finish", limitMiddleware, h.StudentExam.FinishExam)
				studentExam.GET("/history", h.StudentExam.GetHistory)

				execution := studentExam.Group("/execute")
				execution.Use(middleware.SEBMiddleware(examExecutionRepo, studentExamRepo))
				{
					execution.POST("/start", h.StudentExam.StartExam)
					execution.POST("/sync", h.StudentExam.SyncAnswers)
					execution.POST("/heartbeat", h.StudentExam.Heartbeat)
				}
			}
		}
	}
}
