.PHONY: check smoke smoke-full

check:
	./scripts/check.sh

smoke:
	python3 scripts/smoke.py

smoke-full:
	python3 scripts/smoke.py --full
