# Standard-library-only localhost server for this static application.
using Sockets
const ROOT=realpath(joinpath(@__DIR__,".."))
const MIME=Dict(".html"=>"text/html; charset=utf-8",".mjs"=>"text/javascript; charset=utf-8",
    ".css"=>"text/css; charset=utf-8",".json"=>"application/json",".svg"=>"image/svg+xml",
    ".txt"=>"text/plain; charset=utf-8",".md"=>"text/plain; charset=utf-8")
function respond(sock)
    try
        request=split(readline(sock));length(request)>=2||return
        while !isempty(strip(readline(sock))); end
        method,url=request[1],split(request[2],'?')[1]
        if !(method in ("GET","HEAD"));write(sock,"HTTP/1.1 405 Method Not Allowed\r\nConnection: close\r\n\r\n");return;end
        # No percent-decoding is needed for the application's ASCII paths.
        path=normpath(joinpath(ROOT,lstrip(url,'/')))
        isdir(path)&&(path=joinpath(path,"index.html"))
        allowed=startswith(path,ROOT*"/")&&isfile(path)&&startswith(realpath(path),ROOT*"/")
        if !allowed;write(sock,"HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\nNot found");return;end
        bytes=read(path);mime=get(MIME,splitext(path)[2],"application/octet-stream")
        write(sock,"HTTP/1.1 200 OK\r\nContent-Type: $mime\r\nContent-Length: $(length(bytes))\r\nConnection: close\r\n\r\n")
        method=="GET"&&write(sock,bytes)
    catch e
        e isa EOFError||@warn "Request failed" exception=e
    finally
        close(sock)
    end
end
port=isempty(ARGS) ? 8000 : parse(Int,ARGS[1])
server=listen(ip"127.0.0.1",port)
println("Tetrahedral explorer: http://127.0.0.1:$port/ (Ctrl-C to stop)")
while true
    sock=accept(server)
    @async respond(sock)
end
