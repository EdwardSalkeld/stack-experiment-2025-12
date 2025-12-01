// src/routes/index.tsx
import * as fs from "node:fs";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { desc } from "drizzle-orm";
import { useState } from "react";

import { messagesTable } from "../db/schema";
import { db } from "../index";

const filePath = "count.txt";

async function readCount() {
  return Number.parseInt(
    await fs.promises.readFile(filePath, "utf-8").catch(() => "0"),
    10,
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

const getMessages = createServerFn({
  method: "GET",
}).handler(async () => {
  const messages = db
    .select()
    .from(messagesTable)
    .orderBy(desc(messagesTable.timestamp))
    .limit(10)
    .all();
  return messages.reverse();
});

export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => {
    const count = await getCount();
    const messages = await getMessages();
    return { count, messages };
  },
});

function Home() {
  const router = useRouter();
  const { count, messages } = Route.useLoaderData();
  const [message, setMessage] = useState("");

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
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
          Add 1 to {count}?
        </button>
      </div>

      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "30px",
          borderRadius: "8px",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#333" }}>
          Messages
        </h2>

        {messages.length > 0 && (
          <div style={{ marginBottom: "30px" }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  backgroundColor: "white",
                  padding: "15px",
                  marginBottom: "10px",
                  borderRadius: "6px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#888",
                    marginBottom: "8px",
                  }}
                >
                  {new Date(msg.timestamp).toLocaleString()}
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    color: "#333",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
        )}

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
          disabled={message.trim().length === 0}
          onClick={() => {
            const trimmedMessage = message.trim();
            if (trimmedMessage.length === 0) return;

            myFunction({ data: { message: trimmedMessage } }).then(
              (response) => {
                console.log(response);
                setMessage("");
                router.invalidate();
              },
            );
          }}
          style={{
            marginTop: "12px",
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: message.trim().length === 0 ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: message.trim().length === 0 ? "not-allowed" : "pointer",
            fontWeight: "500",
          }}
        >
          Send Message
        </button>
      </div>
    </div>
  );
}
