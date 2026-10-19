
# ReviewLens Amazon Review Dashboard

ReviewLens is a dashboard for summarizing and analyzing Amazon reviews for a product.

### How to use
ReviewLens accepts:
- An Amazon product URL
- An Amazon product name

Upon searching for either, the model will read the reviews and parse them, then product two distinct results:

#### Product Review Summary
The model will summarize the reviews read and display it, including the sentiment in the summary

#### Product Topic sentiment
The model will pick at most 8 main topics discussed in the reviews it parsed, then assign an average sentiment value, clamped between [1-, 1], and display this as a progress bar on the dashboard.


### Additional features
#### Review Chatbot
The dashboard includes a chatbot with a context window including the summary and topics it analyzed, and allows the user to ask questions about the reviews

### Technical Details
Reviews are parsed using the Google Vertex AI API. The API returns chat completions that are formatted in such a way that the app can parse the data and extract the results.

The model used is `gemini-2.5-flash`

We used this model due to its low cost incurred and speed

## Prerequisites

To run this application locally, you need:

*   **[Google Cloud SDK / gcloud CLI](https://cloud.google.com/sdk/docs/install)**: Follow the instructions to install the SDK.

*   **gcloud Initialization**:
    *   Initialize the gcloud CLI:
        ```bash
        gcloud init
        ```
    *   Authenticate for Application Default Credentials (needed to call Google Cloud APIs):
        ```bash
        gcloud auth application-default login
        ```

*   **Node.js and npm**: Ensure you have Node.js and its package manager, `npm`, installed on your machine.

## Project Structure

The project is organized into two main directories:

*   `frontend/`: Contains the Frontend application code.
*   `backend/`: Contains the Node.js/Express server code to proxy Google Cloud API calls.

## Backend Environment Variables

The `backend/.env.local` file is automatically generated when you download this application.
It contains essential Google Cloud environment variables pre-configured based on your project settings at the time of download.

The variables set in `backend/.env.local` are:
*   `API_BACKEND_PORT`: The port the backend API server listens on (e.g., `5000`).
*   `API_PAYLOAD_MAX_SIZE`: The maximum size of the request payload accepted by the backend server (e.g., `5mb`).
*   `GOOGLE_CLOUD_LOCATION`: The Google Cloud region associated with your project.
*   `GOOGLE_CLOUD_PROJECT`: Your Google Cloud Project ID.

**Note:** These variables are automatically populated during the download process.
You can modify the values in `backend/.env.local` if you need to change them.

## Installation and Running the App

To install dependencies and run your Google Cloud Vertex AI Studio App locally, execute the following command:

```bash
npm install && npm run dev
