FROM golang:1.24.3 AS builder

WORKDIR /app
COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .
RUN go build -o server .

# ✅ Match runtime base to avoid GLIBC errors
FROM golang:1.24.3

WORKDIR /app
COPY --from=builder /app/server .

EXPOSE 8080
CMD ["./server"]
