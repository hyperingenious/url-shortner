function areDatesEqual(dateISO1, dateISO2) {
    const dateObj1 = new Date(dateISO1);
    const dateObj2 = new Date(dateISO2);
    return (
        dateObj1.getFullYear() === dateObj2.getFullYear() &&
        dateObj1.getMonth() === dateObj2.getMonth() &&
        dateObj1.getDate() === dateObj2.getDate()
    );
}
module.exports = {areDatesEqual}