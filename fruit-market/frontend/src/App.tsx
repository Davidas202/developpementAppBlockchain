import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from "./config";
import "./App.css";

declare global {
  interface Window {
    ethereum?: any;
  }
}

type Product = {
  id: bigint;
  name: string;
  priceWei: bigint;
  stock: bigint;
  seller: string;
  active: boolean;
  category?: string;
};

function App() {
  const [account, setAccount] = useState("");
  const [networkOk, setNetworkOk] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState("");

  const [name, setName] = useState("");
  const [priceEth, setPriceEth] = useState("");
  const [stock, setStock] = useState("");

  const [buyQuantity, setBuyQuantity] = useState("1");

  const [categoryProductId, setCategoryProductId] = useState("");
  const [category, setCategory] = useState("");

  async function getProvider() {
    if (!window.ethereum) {
      throw new Error("MetaMask n'est pas installé.");
    }

    return new ethers.BrowserProvider(window.ethereum);
  }

  async function getContractWithSigner() {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }

  async function getContractReadOnly() {
    const provider = await getProvider();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        setStatus("MetaMask n'est pas installé.");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setAccount(accounts[0]);

      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      setNetworkOk(chainId === SEPOLIA_CHAIN_ID);

      if (chainId !== SEPOLIA_CHAIN_ID) {
        setStatus("Veuillez sélectionner le réseau Sepolia dans MetaMask.");
      } else {
        setStatus("Wallet connecté.");
      }
    } catch (error: any) {
      setStatus(error.message ?? "Erreur de connexion.");
    }
  }

  async function switchToSepolia() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });

      setNetworkOk(true);
      setStatus("Réseau Sepolia sélectionné.");
    } catch {
      setStatus("Impossible de changer vers Sepolia.");
    }
  }

  async function loadProducts() {
    try {
      const contract = await getContractReadOnly();
      const result = await contract.getAllProducts();

      const productsWithCategories = await Promise.all(
        result.map(async (raw: any) => {
          const product: Product = {
            id: raw.id,
            name: raw.name,
            priceWei: raw.priceWei,
            stock: raw.stock,
            seller: raw.seller,
            active: raw.active,
          };

          try {
            const category = await contract.getProductCategory(product.id);
            product.category = category || "";
          } catch {
            product.category = "";
          }

          return product;
        })
      );

      setProducts(productsWithCategories);
    } catch (error: any) {
      setStatus(error.message ?? "Erreur lors du chargement des produits.");
    }
  }

  async function addProduct() {
    try {
      const contract = await getContractWithSigner();

      const priceWei = ethers.parseEther(priceEth);
      const tx = await contract.addProduct(name, priceWei, BigInt(stock));

      setStatus("Transaction envoyée : ajout du produit...");
      await tx.wait();

      setName("");
      setPriceEth("");
      setStock("");

      setStatus("Produit ajouté avec succès.");
      await loadProducts();
    } catch (error: any) {
      setStatus(getReadableError(error));
    }
  }

  async function buyProduct(product: Product, quantityText: string) {
    try {
      const quantity = BigInt(quantityText);

      if (quantity <= 0n) {
        setStatus("La quantité doit être supérieure à 0.");
        return;
      }

      if (quantity > product.stock) {
        setStatus("Stock insuffisant pour cette quantité.");
        return;
      }

      const totalPrice = product.priceWei * quantity;

      const contract = await getContractWithSigner();
      const tx = await contract.buyProduct(product.id, quantity, {
        value: totalPrice,
      });

      setStatus("Transaction envoyée : achat en cours...");
      await tx.wait();

      setStatus("Achat réussi.");
      await loadProducts();
    } catch (error: any) {
      setStatus(getReadableError(error));
    }
  }

  async function setProductCategory() {
    try {
      const contract = await getContractWithSigner();
      const tx = await contract.setProductCategory(
        BigInt(categoryProductId),
        category
      );

      setStatus("Transaction envoyée : catégorie...");
      await tx.wait();

      setStatus("Catégorie mise à jour.");
      setCategoryProductId("");
      setCategory("");
      await loadProducts();
    } catch (error: any) {
      setStatus(getReadableError(error));
    }
  }

  function getReadableError(error: any): string {
    const message = error?.shortMessage || error?.message || "";

    if (message.includes("unknown custom error")) {
      return "Transaction refusée par le contrat. Vérifiez le stock, le prix ou vos permissions.";
    }

    if (message.includes("user rejected")) {
      return "Transaction annulée dans MetaMask.";
    }

    if (message.includes("insufficient funds")) {
      return "Fonds insuffisants pour payer la transaction.";
    }

    if (message.includes("execution reverted")) {
      return "Action impossible : stock insuffisant, produit invalide ou accès non autorisé.";
    }

    return "Une erreur est survenue.";
  }

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", connectWallet);
      window.ethereum.on("chainChanged", () => window.location.reload());
    }

    loadProducts();
  }, []);

  return (
    <main className="page">
      <header className="header">
        <div>
          <h1>Fruit Market</h1>
          <p>Marketplace décentralisée sur Sepolia</p>
        </div>

        <div className="wallet">
          {account ? (
            <>
              <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
              {!networkOk && (
                <button onClick={switchToSepolia}>Passer à Sepolia</button>
              )}
            </>
          ) : (
            <button onClick={connectWallet}>Connecter MetaMask</button>
          )}
        </div>
      </header>

      {status && <div className="status">{status}</div>}

      <section className="card">
        <h2>Ajouter un fruit</h2>

        <div className="form">
          <input
            placeholder="Nom du fruit"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="Prix en ETH"
            value={priceEth}
            onChange={(e) => setPriceEth(e.target.value)}
          />

          <input
            placeholder="Stock"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />

          <button onClick={addProduct}>Ajouter</button>
        </div>
      </section>

      <section className="card">
        <div className="sectionHeader">
          <h2>Catalogue</h2>
          <button onClick={loadProducts}>Rafraîchir</button>
        </div>

        <div className="grid">
          {products.map((product) => (
            <article className="product" key={product.id.toString()}>
              <h3>{product.name}</h3>
              <p>Prix : {product.priceWei ? ethers.formatEther(product.priceWei) : "0"} ETH</p>
              <p>Stock : {product.stock.toString()}</p>
              {product.category && (
                    <p>Catégorie : {product.category}</p>
              )}
              <p>État : {product.active ? "Disponible" : "Indisponible"}</p>
              <p className="seller">
                Vendeur : {product.seller.slice(0, 6)}...
                {product.seller.slice(-4)}
              </p>

              <div className="buy">
                <input
                  placeholder="Quantité"
                  type="number"
                  min="1"
                  defaultValue="1"
                  onChange={(e) => setBuyQuantity(e.target.value)}
                />

                <button
                  disabled={!product.active || product.stock === 0n}
                  onClick={() => buyProduct(product, buyQuantity)}
                >
                  Acheter
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Fonction V2 : catégorie</h2>

        <div className="form">
          <input
            placeholder="ID du produit"
            value={categoryProductId}
            onChange={(e) => setCategoryProductId(e.target.value)}
          />

          <input
            placeholder="Catégorie ex: Bio"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <button onClick={setProductCategory}>Définir catégorie</button>
        </div>
      </section>
    </main>
  );
}

export default App;