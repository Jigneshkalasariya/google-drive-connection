/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export function useGoogleDrivePicker() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

  useEffect(() => {
    // Load Google Identity Services (GIS)
    const gisScript = document.createElement("script");
    gisScript.src = "https://accounts.google.com/gsi/client";
    gisScript.async = true;
    gisScript.defer = true;
    document.body.appendChild(gisScript);

    // Load Google API (for Picker)
    const gapiScript = document.createElement("script");
    gapiScript.src = "https://apis.google.com/js/api.js";
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
      window.gapi.load("client:picker", async () => {
        await window.gapi.client.load(
          "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
        );
        setIsLoaded(true);
      });
    };
    document.body.appendChild(gapiScript);

    return () => {
      if (document.body.contains(gisScript)) {
        document.body.removeChild(gisScript);
      }
      if (document.body.contains(gapiScript)) {
        document.body.removeChild(gapiScript);
      }
    };
  }, []);

  const openPicker = (
    onSelect: (files: { id: string; name: string; url: string }[]) => void
  ) => {
    if (!isLoaded) {
      alert("Google APIs are still loading. Please try again in a moment.");
      return;
    }

    // Create token client for authentication
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (response: any) => {
        if (response.error) {
          console.error("Authentication error:", response);
          return;
        }

        const token = response.access_token;
        setAccessToken(token);

        // Create and show picker
        const picker = new window.google.picker.PickerBuilder()
          .addView(
            new window.google.picker.DocsView(
              window.google.picker.ViewId.DOCS_IMAGES
            )
              .setIncludeFolders(true)
              .setSelectFolderEnabled(false)
          )
          .setOAuthToken(token)
          .setDeveloperKey(API_KEY)
          .setCallback(async (data: any) => {
            if (data.action === window.google.picker.Action.PICKED) {
              const files = data.docs.map((doc: any) => ({
                id: doc.id,
                name: doc.name,
                url: `https://drive.google.com/uc?export=view&id=${doc.id}`,
              }));
              onSelect(files);
            }
          })
          .setTitle("Select Images from Google Drive")
          .setSize(1051, 650)
          .build();

        picker.setVisible(true);
      },
    });

    // Request access token
    if (accessToken) {
      // Reuse existing token
      const picker = new window.google.picker.PickerBuilder()
        .addView(
          new window.google.picker.DocsView(
            window.google.picker.ViewId.DOCS_IMAGES
          )
            .setIncludeFolders(true)
            .setSelectFolderEnabled(false)
        )
        .setOAuthToken(accessToken)
        .setDeveloperKey(API_KEY)
        .setCallback(async (data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const files = data.docs.map((doc: any) => ({
              id: doc.id,
              name: doc.name,
              url: `https://drive.google.com/uc?export=view&id=${doc.id}`,
            }));
            onSelect(files);
          }
        })
        .setTitle("Select Images from Google Drive")
        .setSize(1051, 650)
        .build();

      picker.setVisible(true);
    } else {
      tokenClient.requestAccessToken({ prompt: "" });
    }
  };

  return { isLoaded, openPicker };
}
