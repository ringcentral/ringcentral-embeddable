#!/usr/bin/env bash

npm run build

cd release
git checkout gh-pages
git add --all .
git commit -m "released at $(date)"
git push origin gh-pages
