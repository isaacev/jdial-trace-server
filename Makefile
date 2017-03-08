JAVA_SRC_DIR     = ./src
JAVA_DEST_DIR    = bin
JAVA_CLASSPATH  := $(JAVA_DEST_DIR)
JAVA_CLASSPATH  := bin/traceprinter/shoelace:$(JAVA_CLASSPATH)
JAVA_CLASSPATH  := packages/*:$(JAVA_CLASSPATH)

build-tracer: GenerateTrace

GenerateTrace: traceprinter
	javac -cp "$(JAVA_CLASSPATH)" $(JAVA_SRC_DIR)/GenerateTrace.java -d $(JAVA_DEST_DIR)

traceprinter: ramtools
	javac -cp "$(JAVA_CLASSPATH)" $(JAVA_SRC_DIR)/traceprinter/*.java -d $(JAVA_DEST_DIR)

ramtools: shoelace
	javac -cp "$(JAVA_CLASSPATH)" $(JAVA_SRC_DIR)/traceprinter/ramtools/*.java -d $(JAVA_DEST_DIR)

shoelace:
	mkdir -p $(JAVA_DEST_DIR)
	javac -cp "$(JAVA_CLASSPATH)" $(JAVA_SRC_DIR)/traceprinter/shoelace/*.java -d $(JAVA_DEST_DIR)

clean:
	rm -rf $(JAVA_DEST_DIR)
