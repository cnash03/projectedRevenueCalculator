import firebase_admin
from firebase_admin import credentials
from firebase_functions import https_fn, options

# Initialize the Firebase app
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["get", "post"],
    )
)

@https_fn.on_request()
def hello_world(req: https_fn.Request) -> https_fn.Response:
    """Simple Hello World function that returns a greeting."""
    return https_fn.Response("Hello World from Firebase Cloud Functions!")