import { NextResponse } from 'next/server'

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIn0",
      payload: "eyJkb21haW4iOiJzY2lmbG93bGFicy5jb20ifQ",
      signature: "PLACEHOLDER_SIGN_WITH_CUSTODY_WALLET"
    },
    frame: {
      version: "1",
      name: "SciFlow",
      iconUrl: "https://sciflowlabs.com/icon.png",
      homeUrl: "https://sciflowlabs.com",
      imageUrl: "https://sciflowlabs.com/og-image.png",
      buttonTitle: "Launch SciFlow",
      splashImageUrl: "https://sciflowlabs.com/icon.png",
      splashBackgroundColor: "#0a0a0b",
      webhookUrl: "https://sciflowlabs.com/api/webhooks/frame"
    }
  }

  return NextResponse.json(manifest, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  })
}
