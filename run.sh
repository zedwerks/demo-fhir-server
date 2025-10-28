#!/bin/bash
cd app
node server.js &
cd ..
echo "Services are running. You can access the EMR Web app at http://localhost:9000"