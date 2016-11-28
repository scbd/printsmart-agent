#!/bin/bash
set -e

service cups start

exec "$@"
