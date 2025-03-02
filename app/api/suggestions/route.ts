import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.toLowerCase() || "";

  try {
    // Fetch data from the API
    const response = await fetch(
      "https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete"
    );
    const variables = await response.json();

    // Filter variables based on the query
    const filteredVariables = variables.filter(
      (variable: any) =>
        variable.name.toLowerCase().includes(query) ||
        variable.category.toLowerCase().includes(query) ||
        variable?.inputs?.toLowerCase()?.includes(query)
    );

    return NextResponse.json(filteredVariables);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
