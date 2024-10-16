FROM ghcr.io/tursodatabase/libsql-server:v0.24.23

RUN apt-get update && apt-get install -y curl unzip

RUN curl -sSL https://github.com/nalgeon/sqlean/releases/download/0.27.1/sqlean-linux-x86.zip -o /tmp/sqlean.zip && \
  unzip /tmp/sqlean.zip -d /etc/libsql && \
  rm /tmp/sqlean.zip

COPY ./trusted.lst /etc/libsql/trusted.lst

CMD ["/bin/sqld", "--extensions-path", "/etc/libsql"]
