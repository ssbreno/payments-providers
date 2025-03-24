#!/bin/bash

echo "Creating Kafka topics..."

TOPICS=(
    "payment.processing"
    "payment.success"
    "payment.failure"
    "payment.retry"
    "payment.recovery"
    "provider.status"
    "circuit.control"
)

for topic in "${TOPICS[@]}"; do
    echo "Creating topic: $topic"
    docker exec -it kafka kafka-topics --create --topic "$topic" \
        --bootstrap-server localhost:9092 \
        --partitions 1 \
        --replication-factor 1 \
        --if-not-exists
    
    if [ $? -eq 0 ]; then
        echo "✅ Topic $topic created/exists"
    else
        echo "❌ Failed to create topic $topic"
    fi
done

echo "Listing all topics:"
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092

echo "Kafka topics setup complete!"
