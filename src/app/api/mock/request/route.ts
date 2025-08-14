import { ResponseType } from "@/lib/types/apiResponse";
import { ServerResponseBuilder } from "@/lib/builders/serverResponseBuilder";
import { connectToMongo } from "@/lib/mongodb";
import { PAGINATION_PAGE_SIZE } from "@/lib/constants/config";
import { ObjectId } from "mongodb";

async function getRequestsCollection() {
  const client = await connectToMongo();
  return client.db("gurtbit").collection("requests");
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.get("ping") === "1") {
    try {
      const client = await connectToMongo();
      await client.db("admin").command({ ping: 1 });
      return new Response(JSON.stringify({ status: "yooo it worked" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ status: "u gurt it failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const statusFilter = url.searchParams.get("status");
  const page = parseInt(url.searchParams.get("page") || "1");

  try {
    const collection = await getRequestsCollection();

    const query = statusFilter ? { status: statusFilter } : {};
    const total = await collection.countDocuments(query);

    const requests = await collection
      .find(query)
      .sort({ requestCreatedDate: -1 })
      .skip((page - 1) * PAGINATION_PAGE_SIZE)
      .limit(PAGINATION_PAGE_SIZE)
      .toArray();

    return new Response(
      JSON.stringify({
        page,
        pageSize: PAGINATION_PAGE_SIZE,
        total,
        data: requests,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return new ServerResponseBuilder(ResponseType.UNKNOWN_ERROR).build();
  }
}

export async function PUT(request: Request) {
  try {
    const reqBody = await request.json();

    if (!reqBody.requestorName || !reqBody.itemRequested) {
      return new ServerResponseBuilder(ResponseType.INVALID_INPUT).build();
    }

    const newRequest = {
      requestorName: reqBody.requestorName,
      itemRequested: reqBody.itemRequested,
      requestCreatedDate: new Date(),
      lastEditedDate: new Date(),
      status: "pending",
    };

    const collection = await getRequestsCollection();
    const result = await collection.insertOne(newRequest);

    return new Response(JSON.stringify({ ...newRequest, id: result.insertedId }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new ServerResponseBuilder(ResponseType.UNKNOWN_ERROR).build();
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { _id, status } = body;

    if (!_id || !status) {
      return new ServerResponseBuilder(ResponseType.INVALID_INPUT).build();
    }

    const collection = await getRequestsCollection();
    const query = ObjectId.isValid(_id) ? { _id: new ObjectId(_id) } : { _id };

    const result = await collection.findOneAndUpdate(
      query,
      { $set: { status, lastEditedDate: new Date() } },
      { returnDocument: "after" }
    );

    if (!result || !result.value) {
      return new Response(
        JSON.stringify({ success: false, error: "Request not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result.value }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("PATCH error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
