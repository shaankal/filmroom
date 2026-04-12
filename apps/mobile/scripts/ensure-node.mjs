const major = Number(process.version.slice(1).split(".")[0] || 0);
if (major < 20) {
  console.error(
    `\nFilm Room mobile requires Node.js 20 or newer (Expo SDK 54 / undici need ReadableStream).\n` +
      `Current: ${process.version}\n\n` +
      `Fix: nvm install 20 && nvm use 20\n` +
      `Or install from https://nodejs.org/ and ensure \`which node\` points to it.\n`
  );
  process.exit(1);
}
