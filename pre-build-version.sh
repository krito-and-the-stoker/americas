echo "{\"revision\": \"$(git rev-parse HEAD)\", \"date\": \"$(date -u)\"}" > game/src/version/version.json

echo "Wrote version.json: $(cat game/src/version/version.json)"
