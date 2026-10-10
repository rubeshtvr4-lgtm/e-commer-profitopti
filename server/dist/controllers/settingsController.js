export async function getSettings(req, res) {
    const user = req.user;
    res.json({
        success: true,
        data: {
            profile: {
                id: user._id,
                name: user.name,
                email: user.email,
                businessName: user.businessName,
                currency: user.currency,
                timezone: user.timezone,
                expenseCategories: user.expenseCategories,
            },
        },
    });
}
export async function updateSettings(req, res) {
    const user = req.user;
    const { name, businessName, currency, timezone, expenseCategories } = req.body;
    if (name)
        user.name = name;
    if (businessName)
        user.businessName = businessName;
    if (currency)
        user.currency = currency;
    if (timezone)
        user.timezone = timezone;
    if (expenseCategories && Array.isArray(expenseCategories)) {
        user.expenseCategories = expenseCategories;
    }
    await user.save();
    res.json({
        success: true,
        message: 'Settings updated successfully',
        data: {
            profile: {
                id: user._id,
                name: user.name,
                email: user.email,
                businessName: user.businessName,
                currency: user.currency,
                timezone: user.timezone,
                expenseCategories: user.expenseCategories,
            },
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                businessName: user.businessName,
                currency: user.currency,
                timezone: user.timezone,
                expenseCategories: user.expenseCategories,
            },
        },
    });
}
