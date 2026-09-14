#!/usr/bin/env bash

npm run build

cd build/rc
git checkout gh-pages
git add --all .
git commit -m "released at $(date)"
git push origin gh-pages
