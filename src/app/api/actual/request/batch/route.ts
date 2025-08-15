import { connectToMongo } from "@/lib/mongodb";
import { ServerResponseBuilder } from "@/lib/builders/serverResponseBuilder";
import { ResponseType } from "@/lib/types/apiResponse";
import { ObjectId } from "mongodb";

async function getRequestsCollection() {
  const client = await connectToMongo();
  return client.db("gurtbit").collection("requests");
}

export async function PATCH(request: Request) {
  try {
    const { updates } = await request.json();
    if (!updates || !Array.isArray(updates) || updates.length === 0) return new ServerResponseBuilder(ResponseType.INVALID_INPUT).build();

    const collection = await getRequestsCollection();
    const bulkOps = updates
      .filter(u => u._id && u.status && ObjectId.isValid(u._id))
      .map(u => ({
        updateOne: {
          filter: { _id: new ObjectId(u._id) },
          update: { $set: { status: u.status, lastEditedDate: new Date() } },
        },
      }));

    if (bulkOps.length === 0) return new ServerResponseBuilder(ResponseType.INVALID_INPUT).build();
    const result = await collection.bulkWrite(bulkOps);
    return new Response(JSON.stringify({ modifiedCount: result.modifiedCount }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("PATCH_BATCH error:", err);
    return new ServerResponseBuilder(ResponseType.UNKNOWN_ERROR).build();
  }
}

export async function DELETE(request: Request) {
  try {
    const { _ids } = await request.json();
    if (!_ids || _ids.length === 0) return new ServerResponseBuilder(ResponseType.INVALID_INPUT).build();

    const collection = await getRequestsCollection();
    const objectIds = _ids.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
    const result = await collection.deleteMany({ _id: { $in: objectIds } });
    return new Response(JSON.stringify({ deletedCount: result.deletedCount }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch {
    return new ServerResponseBuilder(ResponseType.UNKNOWN_ERROR).build();
  }
}
