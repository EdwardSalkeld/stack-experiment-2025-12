// src/routes/index.tsx
import * as fs from "node:fs";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

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
    return "Hello from the worker!";
  });
export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => await getCount(),
});

function Home() {
  const router = useRouter();
  const state = Route.useLoaderData();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          updateCount({ data: 1 }).then(() => {
            router.invalidate();
          });
        }}
      >
        Add 1 to {state}?
      </button>
      <p>Hello</p>
      <button
        type="button"
        onClick={() => {
          myFunction({ data: { message: "Hello from the client!" } }).then(
            (response) => {
              console.log(response);
            },
          );
        }}
      >
        "Send Message to Worker"
      </button>
    </div>
  );
}
