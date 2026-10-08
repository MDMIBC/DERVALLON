import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";

const pages = () => import("./pages/DrevallonPages");
const AboutPage = lazy(() => pages().then((module) => ({ default: module.AboutPage })));
const AccountPage = lazy(() => pages().then((module) => ({ default: module.AccountPage })));
const CategoryPage = lazy(() => pages().then((module) => ({ default: module.CategoryPage })));
const CollectionsPage = lazy(() => pages().then((module) => ({ default: module.CollectionsPage })));
const ContactPage = lazy(() => pages().then((module) => ({ default: module.ContactPage })));
const DeliveryPage = lazy(() => pages().then((module) => ({ default: module.DeliveryPage })));
const Home = lazy(() => pages().then((module) => ({ default: module.Home })));
const InformationPage = lazy(() => pages().then((module) => ({ default: module.InformationPage })));
const NotFound = lazy(() => pages().then((module) => ({ default: module.NotFound })));
const ProductPage = lazy(() => pages().then((module) => ({ default: module.ProductPage })));
const ReturnsPage = lazy(() => pages().then((module) => ({ default: module.ReturnsPage })));
const SearchPage = lazy(() => pages().then((module) => ({ default: module.SearchPage })));
const StudioPage = lazy(() => pages().then((module) => ({ default: module.StudioPage })));
const CustomOrderPage = lazy(() => import("./pages/CustomOrderPage"));
const FitProfilePage = lazy(() => import("./pages/FitProfilePage"));
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<div className="route-loading" role="status">Loading DERVALLON</div>}>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/collections" component={CollectionsPage} />
      <Route path="/category/:category" component={CategoryPage} />
      <Route path="/product/:id" component={ProductPage} />
      <Route path="/studio" component={StudioPage} />
      <Route path="/custom-order" component={CustomOrderPage} />
      <Route path="/account/fit" component={FitProfilePage} />
      <Route path="/account" component={AccountPage} />
      <Route path="/account/saved-designs" component={AccountPage} />
      <Route path="/account/orders" component={AccountPage} />
      <Route path="/account/wardrobe" component={AccountPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/delivery" component={DeliveryPage} />
      <Route path="/information" component={InformationPage} />
      <Route path="/returns" component={ReturnsPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

export default function App() {
  return <ErrorBoundary><Router /></ErrorBoundary>;
}
