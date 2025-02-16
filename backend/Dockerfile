# Start from the official Go image
FROM golang:1.23

# Set the working directory inside the container
WORKDIR /app

# Copy the go mod and sum files
COPY go.mod go.sum ./

ENV GOPROXY=https://proxy.golang.org/cached-only,https://proxy.golang.org/,direct

# Download all dependencies
RUN go mod download

# Install Air for live reloading
RUN go install github.com/air-verse/air@latest

# Copy the Air configuration file
COPY .air.toml ./

COPY . .

RUN go build -o main .

EXPOSE 8080
