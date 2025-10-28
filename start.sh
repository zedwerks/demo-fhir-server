#!/bin/bash

# Check if docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker could not be found. Please install it first."
    exit
fi
# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "Docker Compose could not be found. Please install it first."
    exit
fi
# Check if docker is running
if ! docker info &> /dev/null
then
    echo "Docker is not running. Please start Docker first."
    exit
fi

docker network create demonetwork || echo "Network 'demonetwork' already exists."

echo "Building Services..."
docker compose down -v
if docker compose build --no-cache; then
    echo "Services built successfully. Now starting..."
    docker compose up -d
else 
    echo "EMR Web app failed to start."
    exit 1
fi
