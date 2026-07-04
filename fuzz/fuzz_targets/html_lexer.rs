#![no_main]
use libfuzzer_sys::fuzz_target;
use motarjim_lexer::html::HtmlTokenizer;

fuzz_target!(|data: &[u8]| {
    if let Ok(s) = std::str::from_utf8(data) {
        let mut tokenizer = HtmlTokenizer::new(s);
        tokenizer.tokenize();
    }
});
