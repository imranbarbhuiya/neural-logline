const forbidden = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\/(?:Users|home)\/[^/\s]+\//,
  /(?:ghp|github_pat|sk-[A-Za-z0-9_-]{8})[A-Za-z0-9_-]+/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
const allowedEmail = "imranbarbhuiya.fsd@gmail.com";
const files = [...new Bun.Glob("**/*").scanSync({ cwd: new URL("..", import.meta.url).pathname, onlyFiles: true })]
  .filter((file) => !file.startsWith(".git/") && !file.startsWith("dist/") && !file.includes("node_modules/"));
for (const path of files) {
  const text = (await Bun.file(new URL(`../${path}`, import.meta.url)).text()).replaceAll(allowedEmail, "allowed-at-example.invalid");
  for (const pattern of forbidden) if (pattern.test(text)) throw new Error(`private identifier matched ${pattern} in ${path}`);
}
console.log(`privacy scan passed (${files.length} files)`);
