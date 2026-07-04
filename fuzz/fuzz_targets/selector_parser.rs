#![no_main]
use libfuzzer_sys::fuzz_target;
use motarjim_selectors::parse_selector;

fuzz_target!(|data: &[u8]| {
    if let Ok(s) = std::str::from_utf8(data) {
        let _ = parse_selector(s);
    }
});
