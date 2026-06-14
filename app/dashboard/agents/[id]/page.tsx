import { db } from "../../../../lib/db";
import { agent_runs } from "../../../../lib/db/schema";
import { eq } from "drizzle-orm";

export default async function AgentRunDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  const runId = resolved.id;
  
  const run = await db.query.agent_runs.findFirst({
    where: eq(agent_runs.id, runId),
  });

  if (!run) {
    return <div>Run not found</div>;
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Agent Run Details</h1>
      
      <div className="bg-gray-900 border border-gray-800 p-4 rounded-md mb-4">
         <p><strong>Type:</strong> {run.agent_type}</p>
         <p><strong>Status:</strong> {run.status}</p>
         <p><strong>Duration:</strong> {run.duration_ms} ms</p>
      </div>

      <details className="bg-gray-900 border border-gray-800 p-4 rounded-md outline-none">
        <summary className="font-semibold cursor-pointer mb-2">Audit Trail (Prompt & Response)</summary>
        <div className="mt-4">
          <p className="text-sm text-gray-400 uppercase mb-2">Prompt Sent:</p>
          <pre className="bg-gray-950 p-4 rounded overflow-auto text-xs font-mono border border-gray-800">
            {run.prompt_sent || "N/A"}
          </pre>
          
          <p className="text-sm text-gray-400 uppercase mb-2 mt-4">Raw AI Response:</p>
          <pre className="bg-gray-950 p-4 rounded overflow-auto text-xs font-mono border border-gray-800">
            {run.raw_ai_response || "N/A"}
          </pre>
        </div>
      </details>
    </div>
  );
}
