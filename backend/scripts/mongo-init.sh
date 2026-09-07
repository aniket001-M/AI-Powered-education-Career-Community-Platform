#!/bin/bash
# Initialize MongoDB replica set for transaction support
echo "Waiting for MongoDB to start..."
sleep 2

mongosh --eval "
  try {
    rs.status();
    print('Replica set already initialized');
  } catch(e) {
    rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]});
    print('Replica set initialized');
  }
"
