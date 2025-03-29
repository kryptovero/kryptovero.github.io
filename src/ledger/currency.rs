#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct Currency {
    pub(crate) code: String,
    pub(crate) precision: u32,
}
