.PHONY: test test-release bench clippy fmt

test:
	cargo test

test-release:
	cargo test --release

bench:
	cargo bench --workspace

clippy:
	cargo clippy -- -D warnings

fmt:
	cargo fmt --check
