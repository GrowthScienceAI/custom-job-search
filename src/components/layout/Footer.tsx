export function Footer() {
    return (
        <footer className="border-t bg-gray-50 py-8 text-center text-sm text-gray-500">
            <div className="container mx-auto px-4">
                <p>&copy; {new Date().getFullYear()} Unified Job Search Platform. All rights reserved.</p>
            </div>
        </footer>
    );
}
