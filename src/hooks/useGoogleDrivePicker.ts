/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";

/**
 * Global type declarations for Google APIs
 * These are loaded dynamically from external scripts
 */
declare global {
  interface Window {
    gapi: any; // Google API client library
    google: any; // Google Identity Services and Picker
  }
}

/**
 * Custom hook for integrating Google Drive Picker
 * Allows users to select files from their Google Drive with OAuth authentication
 *
 * @returns {Object} - Contains isLoaded state and openPicker function
 */
export function useGoogleDrivePicker() {
  // Track if Google APIs have finished loading
  const [isLoaded, setIsLoaded] = useState(false);
  // Store OAuth access token for authenticated requests
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Google Cloud Console credentials (set in .env.local)
  const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  // OAuth scope - read-only access to Drive files
  const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

  /**
   * Fetches a file from Google Drive as a blob URL
   * This allows us to display private Drive files without CORS issues
   *
   * @param {string} fileId - The Google Drive file ID
   * @param {string} token - OAuth access token for authentication
   * @returns {Promise<string|null>} - Blob URL or null if fetch fails
   */
  const fetchImageAsBlob = async (fileId: string, token: string) => {
    try {
      // Request file content with authentication header
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }

      // Convert response to blob and create a local URL
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error fetching file:", error);
      return null;
    }
  };

  /**
   * Load Google APIs on component mount
   * Loads both Google Identity Services (for auth) and Google Picker API
   */
  useEffect(() => {
    // Load Google Identity Services (GIS) for OAuth 2.0
    const gisScript = document.createElement("script");
    gisScript.src = "https://accounts.google.com/gsi/client";
    gisScript.async = true;
    gisScript.defer = true;
    document.body.appendChild(gisScript);

    // Load Google API client library (for Picker and Drive API)
    const gapiScript = document.createElement("script");
    gapiScript.src = "https://apis.google.com/js/api.js";
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
      // Once loaded, initialize the Picker and Drive v3 API
      window.gapi.load("client:picker", async () => {
        await window.gapi.client.load(
          "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
        );
        setIsLoaded(true); // Mark APIs as ready
      });
    };
    document.body.appendChild(gapiScript);

    // Cleanup: remove scripts when component unmounts
    return () => {
      if (document.body.contains(gisScript)) {
        document.body.removeChild(gisScript);
      }
      if (document.body.contains(gapiScript)) {
        document.body.removeChild(gapiScript);
      }
    };
  }, []);

  /**
   * Opens the Google Drive Picker dialog
   * Handles authentication and file selection
   *
   * @param {Function} onSelect - Callback function called with selected files
   */
  const openPicker = async (
    onSelect: (
      files: {
        id: string;
        name: string;
        url: string;
        mimeType: string;
      }[]
    ) => void
  ) => {
    // Ensure APIs are loaded before proceeding
    if (!isLoaded) {
      alert("Google APIs are still loading. Please try again in a moment.");
      return;
    }

    /**
     * Create OAuth token client for authentication
     * This uses the new Google Identity Services (GIS) library
     */
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (response: any) => {
        // Handle authentication errors
        if (response.error) {
          console.error("Authentication error:", response);
          return;
        }

        // Store access token for future requests
        const token = response.access_token;
        setAccessToken(token);

        /**
         * Build and display the Google Picker
         * Multiple views allow users to filter by file type
         */
        const picker = new window.google.picker.PickerBuilder()
          // View 1: All files
          .addView(
            new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
              .setIncludeFolders(true)
              .setSelectFolderEnabled(false)
          )
          // View 2: Images only
          .addView(
            new window.google.picker.DocsView(
              window.google.picker.ViewId.DOCS_IMAGES
            )
          )
          // View 3: Videos only
          .addView(
            new window.google.picker.DocsView(
              window.google.picker.ViewId.DOCS_VIDEOS
            )
          )
          // Enable selecting multiple files at once
          .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
          .setOAuthToken(token)
          .setDeveloperKey(API_KEY)
          // Handle file selection
          .setCallback(async (data: any) => {
            // Only process when user clicks "Select"
            if (data.action === window.google.picker.Action.PICKED) {
              // Fetch each selected file as a blob for local display
              const filesPromises = data.docs.map(async (doc: any) => {
                const blobUrl = await fetchImageAsBlob(doc.id, token);
                return {
                  id: doc.id,
                  name: doc.name,
                  mimeType: doc.mimeType,
                  url: blobUrl || doc.url, // Fallback to doc.url if blob fetch fails
                };
              });

              // Wait for all files to be fetched
              const files = await Promise.all(filesPromises);
              // Call the callback with selected files
              onSelect(files);
            }
          })
          .setTitle("Select Files from Google Drive")
          .setSize(1051, 650)
          .build();

        // Show the picker dialog
        picker.setVisible(true);
      },
    });

    /**
     * Check if we already have an access token
     * If yes, reuse it; if no, request a new one
     */
    if (accessToken) {
      // Reuse existing token - build picker directly
      const picker = new window.google.picker.PickerBuilder()
        .addView(
          new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
            .setIncludeFolders(true)
            .setSelectFolderEnabled(false)
        )
        .addView(
          new window.google.picker.DocsView(
            window.google.picker.ViewId.DOCS_IMAGES
          )
        )
        .addView(
          new window.google.picker.DocsView(
            window.google.picker.ViewId.DOCS_VIDEOS
          )
        )
        .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
        .setOAuthToken(accessToken)
        .setDeveloperKey(API_KEY)
        .setCallback(async (data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const filesPromises = data.docs.map(async (doc: any) => {
              const blobUrl = await fetchImageAsBlob(doc.id, accessToken);
              return {
                id: doc.id,
                name: doc.name,
                mimeType: doc.mimeType,
                url: blobUrl || doc.url,
              };
            });

            const files = await Promise.all(filesPromises);
            onSelect(files);
          }
        })
        .setTitle("Select Files from Google Drive")
        .setSize(1051, 650)
        .build();

      picker.setVisible(true);
    } else {
      // No token yet - request user authentication
      // Empty prompt means silent auth if user already signed in
      tokenClient.requestAccessToken({ prompt: "" });
    }
  };

  return { isLoaded, openPicker };
}
