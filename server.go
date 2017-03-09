package main

import (
    "bytes"
    "net/http"
    "os"
    "os/exec"
    "strings"

    "github.com/gin-gonic/gin"
    "github.com/golang/glog"
)

type TraceRequest struct {
    Source string `form:"source" json:"source" binding:"required"`
    Input  string `form:"input" json:"input"`
    Trace  string `form:"trace" json:"trace"`
}

func main() {
    var port string

    // Ensure that the PORT environment variable is set before proceeding
    if port = os.Getenv("PORT"); port == "" {
        glog.Fatal("$PORT must be set")
    }

    // Create a Gin router with default configuration
    r := gin.Default()

    // Attach API handling functions to their respective HTTP endpoints
    r.POST("/", handleTrace)

    // Start the router listening for incoming requests on the specified port
    r.Run(":" + port)
}

func handleTrace(c *gin.Context) {
    // Create an empty TraceRequest struct that can be populated with the
    // incoming JSON fields
    var trace TraceRequest

    // Populate the TraceRequest struct with data from the HTTP POST body
    c.BindJSON(&trace)

    // If the "source" field of the HTTP POST body contained no data, return
    // an error to the client and stop handling this request
    if len(trace.Source) == 0 {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "no source code data provided",
        })

        glog.Error("no source code data provided")
        return
    }

    // Use the OS to call Java with the given classpath and starting class
    cmd := exec.Command(
        "java",
        "-cp",
        "bin:packages/*",
        "GenerateTrace",
    )

    // In the HTTP request was a string containing Java source code. The Java
    // tracing program expects this data to be input via standard input. Pass
    // this data to the newly created OS exec command over `stdin`
    cmd.Stdin = strings.NewReader(trace.Source)

    // Create a buffer to store data emitted by the Java tracing program
    var out bytes.Buffer

    // Pipe any data passed from the Java program to `stdout` into the newly
    // created `out` buffer
    cmd.Stdout = &out

    // Run the command since the custom `stdin` and `stdout` pipes have been
    // initialized. Capture any errors
    err := cmd.Run()

    // Log any errors emitted during the execution of the Java tracing program
    if err != nil {
        glog.Error(err)
        c.String(http.StatusInternalServerError, "internal error")
    }

    // Return that string as the HTTP response
    c.String(http.StatusOK, out.String())
}
