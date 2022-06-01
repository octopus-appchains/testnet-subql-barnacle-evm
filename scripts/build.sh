#!/bin/bash
yarn
yarn run codegen
yarn run build
rm -rf .data
