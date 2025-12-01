// src/routes/index.tsx
import * as fs from "node:fs";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "../index";
import { messagesTable } from "../db/schema";
import { useState } from "react";

const filePath = "count.txt";

async function readCount() {
  return parseInt(
    await fs.promises.readFile(filePath, "utf-8").catch(() => "0"),
  );
}

const getCount = createServerFn({
  method: "GET",
}).handler(() => {
  return readCount();
});

const updateCount = createServerFn({ method: "POST" })
  .inputValidator((d: number) => d)
  .handler(async ({ data }) => {
    const count = await readCount();
    await fs.promises.writeFile(filePath, `${count + data}`);
  });

const myFunction = createServerFn({ method: "POST" })
  .inputValidator((data: { message: string }) => data)
  .handler(async ({ data }) => {
    console.log(`Worker received message: ${data.message}`);

    await db.insert(messagesTable).values({
      message: data.message,
      timestamp: new Date(),
    });

    return "Hello from the worker!";
  });
export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => await getCount(),
});

function Home() {
  const router = useRouter();
  const state = Route.useLoaderData();
  const [message, setMessage] = useState("");

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: "40px" }}>
        <button
          type="button"
          onClick={() => {
            updateCount({ data: 1 }).then(() => {
              router.invalidate();
            });
          }}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Add 1 to {state}?
        </button>
      </div>

      <div style={{ backgroundColor: "#f8f9fa", padding: "30px", borderRadius: "8px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#333" }}>Send a Message</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message here..."
          style={{
            width: "100%",
            minHeight: "120px",
            padding: "12px",
            fontSize: "16px",
            border: "2px solid #ddd",
            borderRadius: "6px",
            resize: "vertical",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
        <button
          type="button"
          onClick={() => {
            myFunction({ data: { message } }).then(
              (response) => {
                console.log(response);
                setMessage("");
              },
            );
          }}
          style={{
            marginTop: "12px",
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Send Message
        </button>
      </div>
    </div>
  );
}
