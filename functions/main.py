# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

import firebase_admin
from firebase_admin import credentials, firestore, db, initialize_app
from firebase_functions import https_fn, options

# # The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
# from firebase_functions import firestore_fn, https_fn

# # The Firebase Admin SDK to access Cloud Firestore.
# from firebase_admin import initialize_app, firestore
# import google.cloud.firestore

# app = initialize_app()

# Initialize the Firebase app
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

@https_fn.on_call()
def hello_world(req: https_fn.CallableRequest) -> any:
    """HTTP Cloud Function that prints 'Hello, World!' to the console."""
    print("Hello, World!")
    return https.json_response({"message": "Hello, World!"})

# hello_world_function = https_fn.on_call(hello_world)
