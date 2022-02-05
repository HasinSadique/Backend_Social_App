var str = 'Welcome to this Javascript Guide!\n'

// Output becomes !ediuG tpircsavaJ siht ot emocleW
var reverseEntireSentence = reverseBySeparator(str, "");
console.log(reverseEntireSentence);
// Output becomes emocleW ot siht tpircsavaJ !ediuG
var reverseEachWord = reverseBySeparator(reverseEntireSentence, " ");
console.log(reverseEachWord);

function reverseBySeparator(string, separator) {
    return string.split(separator).reverse().join(separator);
}