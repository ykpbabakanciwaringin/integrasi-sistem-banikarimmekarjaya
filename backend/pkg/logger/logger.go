package logger

import (
	"io"
	"os"
	"path/filepath"

	"github.com/natefinch/lumberjack"
	"github.com/sirupsen/logrus"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils" // Import Utils Waktu
)

var Log *logrus.Logger

// customFormatter memastikan timestamp log selalu dicatat dalam waktu WIB
type customFormatter struct {
	logrus.JSONFormatter
}

func (f *customFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	entry.Time = entry.Time.In(utils.WIB) // Kunci waktu log ke WIB
	return f.JSONFormatter.Format(entry)
}

func Init() {
	Log = logrus.New()

	if _, err := os.Stat("logs"); os.IsNotExist(err) {
		os.Mkdir("logs", 0755)
	}

	fileHook := &lumberjack.Logger{
		Filename:   filepath.Join("logs", "app.log"),
		MaxSize:    10,
		MaxBackups: 3,
		MaxAge:     28,
		Compress:   true,
	}

	mw := io.MultiWriter(os.Stdout, fileHook)
	Log.SetOutput(mw)

	Log.SetFormatter(&customFormatter{
		JSONFormatter: logrus.JSONFormatter{
			TimestampFormat: "2006-01-02 15:04:05 WIB",
		},
	})

	Log.SetLevel(logrus.InfoLevel)
}

func Info(args ...interface{})                 { Log.Info(args...) }
func Error(args ...interface{})                { Log.Error(args...) }
func Infof(format string, args ...interface{}) { Log.Infof(format, args...) }
