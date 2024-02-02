# Start from the official Go image
FROM golang:latest

# Set the working directory inside the container
WORKDIR /app

# Copy the go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies
RUN go mod download

# Install Air for live reloading
RUN go install github.com/cosmtrek/air@latest

# Copy the Air configuration file
COPY .air.toml ./

COPY . .

RUN go build -o main .

EXPOSE 8080
