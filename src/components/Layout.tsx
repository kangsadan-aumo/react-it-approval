import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileTopBar from './MobileTopBar';

export default function Layout() {
    return (
        <div className="app-layout">
            <MobileTopBar />
            <Sidebar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
