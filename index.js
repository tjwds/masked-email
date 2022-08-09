#!/usr/bin/env node
require("dotenv").config();

// bail if we don't have our ENV set:
if (!process.env.JMAP_TOKEN) {
  console.log("Please set your JMAP_TOKEN in .env");

  process.exit(1);
}

const hostname = process.env.JMAP_HOSTNAME || "api.fastmail.com";

const authUrl = `https://${hostname}/.well-known/jmap`;
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.JMAP_TOKEN}`,
};

const getSession = async () => {
  const response = await fetch(authUrl, {
    method: "GET",
    headers,
  });
  return response.json();
};

const create = async (apiUrl, accountId) => {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      using: [
        "urn:ietf:params:jmap:core",
        "https://www.fastmail.com/dev/maskedemail",
      ],
      methodCalls: [
        [
          "MaskedEmail/set",
          {
            accountId,
            create: {
              maskedEmail: {
                description:
                  process.argv[2] || "Created via hacky masked email cli",
                state: "enabled",
              },
            },
          },
          "a",
        ],
      ],
    }),
  });
  const data = await response.json();

  return await data.methodResponses[0][1].created.maskedEmail.email;
};

const run = async () => {
  const session = await getSession();
  const apiUrl = session.apiUrl;
  const accountId =
    session.primaryAccounts["https://www.fastmail.com/dev/maskedemail"];
  const res = await create(apiUrl, accountId);
  console.log(res);
};

run();
