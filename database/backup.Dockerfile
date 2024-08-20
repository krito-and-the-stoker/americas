# Use the same MongoDB image
FROM mongo:7.0.4

# Install Python and pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip

# Create a directory for scripts and the Flask app
RUN mkdir -p /scripts

# Set working directory and add it to path
WORKDIR /scripts
ENV PATH="/scripts:${PATH}"

COPY ./requirements.txt .
RUN pip3 install -r requirements.txt

# Copy both the backup and restore scripts and the Flask app
COPY ./scripts .

# Install Python dependencies, including Flask
RUN pip3 install flask

# Set permissions for the scripts
RUN chmod +x /scripts/*.sh

# Command to run the Flask app
CMD ["python3", "/scripts/service.py"]
