#!/usr/bin/env node
// Regenerates the gRPC stubs for both services from calculator/proto/calculator.proto
// and its copy at api/proto/calculator.proto. Neither generated output is
// committed to git (see .gitignore) - run this after cloning and any time
// either .proto file changes.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');

function run(command, cwd) {
  console.log(`> (cd ${path.relative(repoRoot, cwd) || '.'} && ${command})`);
  execSync(command, { cwd, stdio: 'inherit' });
}

// Python stubs (calculator/generated/*.py) - requires `npm run setup:calculator` first.
run(
  '.venv/bin/python -m grpc_tools.protoc -I proto --python_out=generated --grpc_python_out=generated proto/calculator.proto',
  path.join(repoRoot, 'calculator'),
);

// protoc emits an absolute import that doesn't work from inside the
// `generated` package - rewrite it to a relative import.
const grpcStubPath = path.join(
  repoRoot,
  'calculator/generated/calculator_pb2_grpc.py',
);
const grpcStub = fs.readFileSync(grpcStubPath, 'utf8');
fs.writeFileSync(
  grpcStubPath,
  grpcStub.replace(
    'import calculator_pb2 as calculator__pb2',
    'from . import calculator_pb2 as calculator__pb2',
  ),
);

// TypeScript client stubs (api/src/calculator/generated/calculator.ts) -
// requires `npm install` in api/ first (grpc-tools, ts-proto).
run('npm run generate:calculator-proto', path.join(repoRoot, 'api'));

console.log('Generated calculator gRPC stubs for Python and Node.');
