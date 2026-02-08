/**
 * GitHub Service
 * - Fetches public repo structure and key files via GitHub API
 * - No authentication required for public repos
 * - Rate limit: 60 requests/hour for unauthenticated
 */

const https = require("https");

const GITHUB_API = "api.github.com";
const MAX_FILE_SIZE = 100000; // 100KB max per file
const MAX_FILES_TO_READ = 8; // Read at most 8 key files

// File extensions we care about for code review
const CODE_EXTENSIONS = new Set([
  ".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".go", ".rs",
  ".html", ".css", ".scss", ".vue", ".svelte",
  ".json", ".yaml", ".yml", ".toml",
  ".md", ".txt",
  ".sql", ".graphql",
  ".dockerfile", ".dockerignore",
  ".env.example",
  ".gitignore",
]);

// Files to prioritize reading
const PRIORITY_FILES = [
  "readme.md", "README.md", "README",
  "package.json", "requirements.txt", "go.mod", "Cargo.toml", "pom.xml", "build.gradle",
  "tsconfig.json", "next.config.js", "next.config.ts", "vite.config.ts", "vite.config.js",
  ".env.example",
  "docker-compose.yml", "Dockerfile",
];

// Directories to prioritize
const PRIORITY_DIRS = ["src", "app", "pages", "components", "lib", "api", "routes", "controllers", "models", "services", "utils"];

/**
 * Parse a GitHub URL to extract owner and repo.
 * Supports: github.com/owner/repo, github.com/owner/repo.git, etc.
 */
function parseGitHubUrl(url) {
  const cleaned = url.trim().replace(/\.git$/, "").replace(/\/$/, "");
  const match = cleaned.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)/
  );
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

/**
 * Make an HTTPS GET request to GitHub API.
 */
function githubGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: GITHUB_API,
      path,
      method: "GET",
      headers: {
        "User-Agent": "UpSkill-Capstone-Reviewer",
        Accept: "application/vnd.github.v3+json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error("Failed to parse GitHub response"));
          }
        } else if (res.statusCode === 404) {
          reject(new Error("Repository not found. Make sure it's public and the URL is correct."));
        } else if (res.statusCode === 403) {
          reject(new Error("GitHub API rate limit exceeded. Please try again in a few minutes."));
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode}`));
        }
      });
    });

    req.on("error", (err) => reject(new Error(`Failed to reach GitHub: ${err.message}`)));
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("GitHub request timed out"));
    });
    req.end();
  });
}

/**
 * Fetch raw file content from GitHub.
 */
function fetchRawFile(owner, repo, path, branch = "main") {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "raw.githubusercontent.com",
      path: `/${owner}/${repo}/${branch}/${encodeURIComponent(path).replace(/%2F/g, "/")}`,
      method: "GET",
      headers: {
        "User-Agent": "UpSkill-Capstone-Reviewer",
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Handle redirect
        resolve(null);
        return;
      }

      let data = "";
      let size = 0;
      res.on("data", (chunk) => {
        size += chunk.length;
        if (size > MAX_FILE_SIZE) {
          data += chunk.toString().substring(0, MAX_FILE_SIZE - (size - chunk.length));
          req.destroy();
        } else {
          data += chunk;
        }
      });
      res.on("end", () => {
        if (res.statusCode === 200) resolve(data);
        else resolve(null);
      });
    });

    req.on("error", () => resolve(null));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}

/**
 * Determine the default branch of a repo.
 */
async function getDefaultBranch(owner, repo) {
  try {
    const repoInfo = await githubGet(`/repos/${owner}/${repo}`);
    return repoInfo.default_branch || "main";
  } catch {
    return "main";
  }
}

/**
 * Fetch the full file tree of a repo.
 */
async function getFileTree(owner, repo, branch) {
  try {
    const tree = await githubGet(
      `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    );
    if (!tree.tree || !Array.isArray(tree.tree)) {
      throw new Error("Empty repository — no files found.");
    }
    return tree.tree
      .filter((item) => item.type === "blob")
      .map((item) => ({
        path: item.path,
        size: item.size || 0,
      }));
  } catch (err) {
    // Fallback: try "master" if "main" fails
    if (branch === "main") {
      const tree = await githubGet(
        `/repos/${owner}/${repo}/git/trees/master?recursive=1`
      );
      if (tree.tree && Array.isArray(tree.tree)) {
        return tree.tree
          .filter((item) => item.type === "blob")
          .map((item) => ({
            path: item.path,
            size: item.size || 0,
          }));
      }
    }
    throw err;
  }
}

/**
 * Select the most important files to read from the file tree.
 */
function selectKeyFiles(files) {
  const selected = [];
  const remaining = [];

  // 1. Priority files first
  for (const file of files) {
    const fileName = file.path.split("/").pop().toLowerCase();
    if (PRIORITY_FILES.some((p) => p.toLowerCase() === fileName)) {
      selected.push(file.path);
    } else {
      remaining.push(file);
    }
  }

  // 2. Entry point files (index.js, app.js, main.ts, etc.)
  for (const file of remaining) {
    const fileName = file.path.split("/").pop().toLowerCase();
    if (
      /^(index|app|main|server)\.(js|ts|jsx|tsx|py)$/.test(fileName) &&
      selected.length < MAX_FILES_TO_READ
    ) {
      selected.push(file.path);
    }
  }

  // 3. Files in priority directories
  for (const file of remaining) {
    if (selected.length >= MAX_FILES_TO_READ) break;
    if (selected.includes(file.path)) continue;
    const ext = "." + file.path.split(".").pop().toLowerCase();
    if (!CODE_EXTENSIONS.has(ext)) continue;
    const parts = file.path.split("/");
    if (parts.some((p) => PRIORITY_DIRS.includes(p.toLowerCase()))) {
      selected.push(file.path);
    }
  }

  // 4. Fill remaining slots with any code files
  for (const file of remaining) {
    if (selected.length >= MAX_FILES_TO_READ) break;
    if (selected.includes(file.path)) continue;
    const ext = "." + file.path.split(".").pop().toLowerCase();
    if (CODE_EXTENSIONS.has(ext) && file.size < MAX_FILE_SIZE) {
      selected.push(file.path);
    }
  }

  return selected.slice(0, MAX_FILES_TO_READ);
}

/**
 * Main function: Fetch a GitHub repo's structure + key file contents.
 * Returns: { owner, repo, branch, fileTree, files: [{path, content}] }
 */
async function fetchRepository(githubUrl) {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) {
    throw new Error(
      "Invalid GitHub URL. Expected format: https://github.com/owner/repo"
    );
  }

  const { owner, repo } = parsed;

  // Get default branch
  const branch = await getDefaultBranch(owner, repo);

  // Get file tree
  const fileTree = await getFileTree(owner, repo, branch);

  if (fileTree.length === 0) {
    throw new Error("Repository appears to be empty — no files found.");
  }

  // Select key files to read
  const keyFilePaths = selectKeyFiles(fileTree);

  // Fetch file contents in parallel
  const fileContents = await Promise.all(
    keyFilePaths.map(async (filePath) => {
      const content = await fetchRawFile(owner, repo, filePath, branch);
      return content ? { path: filePath, content } : null;
    })
  );

  const files = fileContents.filter(Boolean);

  return {
    owner,
    repo,
    branch,
    fileTree: fileTree.map((f) => f.path),
    files,
    totalFiles: fileTree.length,
  };
}

module.exports = {
  fetchRepository,
  parseGitHubUrl,
};
