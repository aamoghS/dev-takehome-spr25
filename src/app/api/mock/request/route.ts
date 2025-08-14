import { ResponseType } from "@/lib/types/apiResponse";
import {
  createNewMockRequest,
  editMockStatusRequest,
  getMockItemRequests,
} from "@/server/mock/requests";
import { ServerResponseBuilder } from "@/lib/builders/serverResponseBuilder";
import { InputException } from "@/lib/errors/inputExceptions";
import { connectToMongo } from "@/lib/mongodb";
export async function GET(request: Request) {
  const url = new URL(request.url);

  if(url.searchParams.get("ping") == "1") {
    try {
      const client = await connectToMongo();
      await client.db("admin").command({ping: 1 });
      return new Response(JSON.stringify({status: "yooo it worked "}), {
        status: 200,
        headers: {"Content-Type": "application/json"}
      });
    } catch (err) {
      return new Response(JSON.stringify({status: "u gurt it failed "}), 
    {status: 500, headers: {"Content-Type": "application/json"}}
  );
    }
  }


  const status = url.searchParams.get("status");
  const page = parseInt(url.searchParams.get("page") || "1");
  try {
    const paginatedRequests = getMockItemRequests(status, page);
    return new Response(JSON.stringify(paginatedRequests), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof InputException) {
      return new ServerResponseBuilder(ResponseType.INVALID_INPUT).build();
    }
    return new ServerResponseBuilder(ResponseType.UNKNOWN_ERROR).build();
  }
}

export async function PUT(request: Request) {
  try {
    const req = await request.json();
    const newRequest = createNewMockRequest(req);
    return new Response(JSON.stringify(newRequest), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof InputException) {
      return new ServerResponseBuilder(ResponseType.INVALID_INPUT).build();
    }
    return new ServerResponseBuilder(ResponseType.UNKNOWN_ERROR).build();
  }
}

export async function PATCH(request: Request) {
  try {
    const req = await request.json();
    const editedRequest = editMockStatusRequest(req);
    return new Response(JSON.stringify(editedRequest), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof InputException) {
      return new ServerResponseBuilder(ResponseType.INVALID_INPUT).build();
    }
    return new ServerResponseBuilder(ResponseType.UNKNOWN_ERROR).build();
  }
}
