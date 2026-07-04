use std::fmt;

/// Errors during selector parsing.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SelectorParseError {
    /// Empty selector string.
    Empty,
    /// Unexpected token encountered.
    UnexpectedToken(String),
    /// Unmatched bracket.
    UnmatchedBracket,
    /// Unmatched parenthesis.
    UnmatchedParen,
    /// Invalid combinator placement.
    InvalidCombinator,
    /// Invalid attribute operator.
    InvalidAttributeOperator,
}

impl fmt::Display for SelectorParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Empty => write!(f, "empty selector"),
            Self::UnexpectedToken(t) => write!(f, "unexpected token: {t}"),
            Self::UnmatchedBracket => write!(f, "unmatched bracket"),
            Self::UnmatchedParen => write!(f, "unmatched parenthesis"),
            Self::InvalidCombinator => write!(f, "invalid combinator placement"),
            Self::InvalidAttributeOperator => {
                write!(f, "invalid attribute operator")
            }
        }
    }
}
