// Packages imported for reading the program source from stdin
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.lang.StringBuilder;

// Packages imported for tracing
import traceprinter.InMemory;

public class GenerateTrace {
    public static void main(String[] args) {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder builder = new StringBuilder();

        while (true) {
            try {
                String line = null;

                if ((line = in.readLine()) != null) {
                    // Append the newly read line to the string builder and add
                    // a newline since that's stripped by the stream reader
                    builder.append(line + "\n");
                } else {
                    // Exit the read loop once stdin has been emptied
                    break;
                }
            } catch (IOException e) {
                System.err.println("Error reading input");
            }
        }

        // Convert string builder to plain string
        String programSource = builder.toString();
        String programInput = "3 4\n5\n  \n"; // XXX: figure out how to support input passing

        // Pass program source code and accompanying input to VM to build the
        // execution trace in JSON form
        InMemory.run(programSource, programInput);
    }
}
