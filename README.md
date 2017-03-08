# JDial Trace Server

## Standing it up on AWS EC2

### Create the EC2 instance
- Tested on Ubuntu 16.04 AMD64
- Make sure port `80` is exposed over HTTP (can be configured via `Security Groups`)

### Launch up the server
- SSH into the EC2 server
- Install Java OpenJDK 8:

```
sudo apt-get update
sudo apt-get install openjdk-8-jdk
```

- Clone the JDail trace server from GitHub:

```
git clone https://github.com/isaacev/jdial-trace-server.git
```

- Boot up the server program (adding an ampersand so the command will run in the background):

```
cd jdial-trace-server
sudo PORT=80 GIN_MODE=release ./server &
```

- All done!


## Testing that the server works

Send the following HTTP POST request to the `/trace` endpoint at the EC2 server's DNS address:

*If you're trying to copy & paste this HTTP request, be sure to edit the payload so that the JSON blob is all on a single line.*

```
POST /trace HTTP/1.1
Content-Type: application/json; charset=utf-8
Connection: close
Content-Length: 128

{"source":"public class Main {    public static void main(Strin
g[] args) {        System.out.println(\"Hello, world!\");    }}
"}
```

Expect back a response that is something like this:

```
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Length: 1161
Connection: close

{"code":"public class Main {    public static void main(String[
] args) {        System.out.println(\"Hello, world!\");    }}\n
","stdin":"3 4\n5\n  \n","trace":[{"stdout":"","event":"call","
line":1,"stack_to_render":[{"func_name":"main:1","encoded_local
s":{},"ordered_varnames":[],"parent_frame_id_list":[],"is_highl
ighted":true,"is_zombie":false,"is_parent":false,"unique_hash":
"1","frame_id":1}],"globals":{},"ordered_globals":[],"func_name
":"main","heap":{}},{"stdout":"","event":"step_line","line":1,"
stack_to_render":[{"func_name":"main:1","encoded_locals":{},"or
dered_varnames":[],"parent_frame_id_list":[],"is_highlighted":t
rue,"is_zombie":false,"is_parent":false,"unique_hash":"2","fram
e_id":2}],"globals":{},"ordered_globals":[],"func_name":"main",
"heap":{}},{"stdout":"Hello, world!\n","event":"return","line":
1,"stack_to_render":[{"func_name":"main:1","encoded_locals":{"_
_return__":["VOID"]},"ordered_varnames":["__return__"],"parent_
frame_id_list":[],"is_highlighted":true,"is_zombie":false,"is_p
arent":false,"unique_hash":"5","frame_id":5}],"globals":{},"ord
ered_globals":[],"func_name":"main","heap":{}}],"userlog":"Debu
gger VM maxMemory: 239M\n"}
```
